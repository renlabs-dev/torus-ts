import { describe, it, expect } from 'vitest';
import BigNumber from 'bignumber.js';
import { BigNumberBrand, buildTaggedBigNumberClass } from '../bignumber';

describe('BigNumberBrand', () => {
  it('should create a branded BigNumber instance', () => {
    const bn = BigNumberBrand.from<'Test'>(100, BigNumber);
    expect(bn.value.toString()).toBe('100');
    expect(bn.value).toBeInstanceOf(BigNumber);
  });
  
  it('should convert bigint to string when creating instance', () => {
    const bigintValue = 1000n;
    const bn = BigNumberBrand.from<'Test'>(bigintValue, BigNumber);
    expect(bn.value.toString()).toBe('1000');
  });
  
  it('should wrap BigNumber values correctly', () => {
    const bn = BigNumberBrand.from<'Test'>(100, BigNumber);
    const wrappedBn = bn._wrap(new BigNumber(200));
    expect(wrappedBn.value.toString()).toBe('200');
    expect(wrappedBn).toBeInstanceOf(BigNumberBrand);
  });
  
  it('should delegate arithmetic operations to the underlying BigNumber', () => {
    const a = BigNumberBrand.from<'Test'>(100, BigNumber);
    const b = BigNumberBrand.from<'Test'>(50, BigNumber);
    
    const sum = a.plus(b);
    expect(sum.value.toString()).toBe('150');
    
    const diff = a.minus(b);
    expect(diff.value.toString()).toBe('50');
    
    const product = a.multipliedBy(b);
    expect(product.value.toString()).toBe('5000');
    
    const quotient = a.dividedBy(b);
    expect(quotient.value.toString()).toBe('2');
  });
  
  it('should handle comparison operations correctly', () => {
    const a = BigNumberBrand.from<'Test'>(100, BigNumber);
    const b = BigNumberBrand.from<'Test'>(50, BigNumber);
    const c = BigNumberBrand.from<'Test'>(100, BigNumber);
    
    expect(a.isEqualTo(b)).toBe(false);
    expect(a.isEqualTo(c)).toBe(true);
    
    expect(a.isGreaterThan(b)).toBe(true);
    expect(b.isLessThan(a)).toBe(true);
  });
  
  it('should preserve the value formatting', () => {
    const bn = BigNumberBrand.from<'Test'>(12345.6789, BigNumber);
    expect(bn.toFixed(2)).toBe('12345.68');
    expect(bn.toString()).toBe('12345.6789');
  });
});

describe('buildTaggedBigNumberClass', () => {
  it('should create a branded BigNumber class with the specified tag', () => {
    const TokenAmount = buildTaggedBigNumberClass('TokenAmount', BigNumber);
    expect(TokenAmount.Type._tag).toBe('TokenAmount');
  });
  
  it('should create instances through the make function', () => {
    const TokenAmount = buildTaggedBigNumberClass('TokenAmount', BigNumber);
    const amount = TokenAmount.make(100);
    
    expect(amount.value.toString()).toBe('100');
    expect(amount).toBeInstanceOf(BigNumberBrand);
  });
  
  it('should maintain type safety between different branded classes', () => {
    const TokenAmount = buildTaggedBigNumberClass('TokenAmount', BigNumber);
    const USDValue = buildTaggedBigNumberClass('USDValue', BigNumber);
    
    const tokens = TokenAmount.make(100);
    const dollars = USDValue.make(50);
    
    // In TypeScript, this would be a type error:
    // tokens.plus(dollars);
    
    // We can verify they operate independently
    const moreTokens = tokens.plus(TokenAmount.make(150));
    const moreDollars = dollars.plus(USDValue.make(25));
    
    expect(moreTokens.value.toString()).toBe('250');
    expect(moreDollars.value.toString()).toBe('75');
    
    // Test that tags are preserved in operations
    expect(TokenAmount.Type._tag).toBe('TokenAmount');
    expect(USDValue.Type._tag).toBe('USDValue');
  });
  
  it('should allow chaining operations', () => {
    const TokenAmount = buildTaggedBigNumberClass('TokenAmount', BigNumber);
    const amount = TokenAmount.make(100);
    
    const result = amount
      .plus(TokenAmount.make(50))
      .minus(TokenAmount.make(25))
      .multipliedBy(TokenAmount.make(2));
    
    expect(result.value.toString()).toBe('250');
  });
  
  it('should handle different input formats', () => {
    const TokenAmount = buildTaggedBigNumberClass('TokenAmount', BigNumber);
    
    const fromNumber = TokenAmount.make(100.5);
    const fromString = TokenAmount.make('100.5');
    const fromBigint = TokenAmount.make(100n);
    
    expect(fromNumber.isEqualTo(fromString)).toBe(true);
    expect(fromNumber.value.toString()).toBe('100.5');
    expect(fromBigint.value.toString()).toBe('100');
  });
});